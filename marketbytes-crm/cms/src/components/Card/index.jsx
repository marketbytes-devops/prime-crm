const Card = ({ Icon, firstData, secondData }) => {
  return (
    <div className="bg-white shadow-md rounded-3xl p-6 hover:shadow-lg transition-shadow duration-300 grid items-center justify-start space-y-2">
      <span className="flex items-center justify-center bg-gray-200 rounded-full w-14 h-14">
        {Icon && <Icon className="text-gray-600 w-8 h-8" />}
      </span>
      <span className="text-black text-3xl font-bold">
        {firstData}
      </span>
      <span className="text-black text-md font-semibold">
        {secondData}
      </span>
    </div>
  )
}

export default Card
